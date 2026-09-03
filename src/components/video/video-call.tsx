'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Loader2, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoCallProps {
  appointmentId: string;
  onClose: () => void;
}

/**
 * WebRTC Video Call component — connects to the signaling server,
 * negotiates peer connection, and displays local + remote video.
 *
 * The signaling server runs at mini-services/video-signal (port 3004).
 * The gateway forwards WebSocket connections via XTransformPort=3004.
 */
export function VideoCall({ appointmentId, onClose }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<'connecting' | 'waiting' | 'connected' | 'ended'>('connecting');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roomId = `appt-${appointmentId}`;

  const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ice', candidate: event.candidate }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setStatus('connected');
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setStatus('waiting');
      }
    };

    return pc;
  }, []);

  const startCall = useCallback(async () => {
    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // Connect to signaling server — explicit URL when deployed outside the
      // Caddy gateway (e.g. NEXT_PUBLIC_VIDEO_SIGNAL_URL=wss://signal.example.com),
      // otherwise the local gateway forwards via XTransformPort
      const wsUrl = process.env.NEXT_PUBLIC_VIDEO_SIGNAL_URL
        ? process.env.NEXT_PUBLIC_VIDEO_SIGNAL_URL
        : `ws://${window.location.host}/?XTransformPort=3004`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join', room: roomId }));
        setStatus('waiting');
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'room-full':
            // We're the second peer — create offer
            if (!pcRef.current) {
              const pc = createPeerConnection();
              pcRef.current = pc;
              stream.getTracks().forEach(track => pc.addTrack(track, stream));
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: 'offer', sdp: offer }));
            }
            break;

          case 'peer-joined':
            // A new peer joined — they'll create the offer
            break;

          case 'offer':
            if (!pcRef.current) {
              const pc = createPeerConnection();
              pcRef.current = pc;
              stream.getTracks().forEach(track => pc.addTrack(track, stream));
            }
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
            break;

          case 'answer':
            if (pcRef.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            }
            break;

          case 'ice':
            if (pcRef.current && msg.candidate) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
              } catch {}
            }
            break;

          case 'peer-left':
            setStatus('waiting');
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            break;
        }
      };

      ws.onerror = () => {
        setError('Failed to connect to video server');
        setStatus('ended');
      };

      ws.onclose = () => {};
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access camera/microphone');
      setStatus('ended');
    }
  }, [roomId, createPeerConnection]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCall();
    return cleanup;
  }, [startCall, cleanup]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave', room: roomId }));
    }
    cleanup();
    setStatus('ended');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      {/* Remote video (full screen) */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />

        {/* Status overlay */}
        {status !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            {error ? (
              <>
                <VideoOff className="h-12 w-12 text-red-500" />
                <p className="text-sm font-bold text-red-400">{error}</p>
                <Button onClick={onClose} variant="outline" className="gap-1.5 rounded-xl text-white border-white/30">
                  <X className="h-4 w-4" /> Close
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-white">
                  {status === 'connecting' ? 'Connecting…' : 'Waiting for the other person to join…'}
                </p>
                <p className="text-xs text-white/60">Room: {roomId}</p>
              </>
            )}
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 h-32 w-24 overflow-hidden rounded-xl border-2 border-white/20 bg-black sm:h-40 sm:w-28">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover -scale-x-100"
          />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <VideoOff className="h-6 w-6 text-white/40" />
            </div>
          )}
        </div>

        {/* Top bar */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur">
            <Users className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold text-white">
              {status === 'connected' ? 'Connected' : status === 'waiting' ? 'Waiting…' : 'Connecting…'}
            </span>
          </div>
          <button onClick={endCall} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 bg-black px-4 py-4">
        <button
          onClick={toggleMic}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
            micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-600 text-white'
          )}
          aria-label={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleCam}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
            camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-600 text-white'
          )}
          aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <button
          onClick={endCall}
          className="flex h-12 w-16 items-center justify-center gap-1 rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
          aria-label="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}
