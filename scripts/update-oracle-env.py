with open('/etc/sehatai/staging.env', 'r') as f:
    lines = f.readlines()

updates = {
    'CARE_ALLOW_MOCK_PAYMENTS=': 'CARE_ALLOW_MOCK_PAYMENTS=true\n',
    'CARE_PAYMENTS_ENABLED=': 'CARE_PAYMENTS_ENABLED=true\n',
    'CARE_INSTANT_ENABLED=': 'CARE_INSTANT_ENABLED=true\n',
    'CARE_PRESCRIPTIONS_ENABLED=': 'CARE_PRESCRIPTIONS_ENABLED=true\n',
    'STAGING_AUTH_REQUIRED=': 'STAGING_AUTH_REQUIRED="false"\n',
    'STAGING_BLOCK_BOOKING=': 'STAGING_BLOCK_BOOKING=false\n',
    'STAGING_BLOCK_PAYMENTS=': 'STAGING_BLOCK_PAYMENTS=false\n',
    'DATABASE_URL=': 'DATABASE_URL="postgresql://sehatai:SehatAI_Staging_9b8a7c6d5e4f3210_Sec2026@127.0.0.1:5450/sehatai_staging"\n',
    'DATABASE_URL_POOLED=': 'DATABASE_URL_POOLED="postgresql://sehatai:SehatAI_Staging_9b8a7c6d5e4f3210_Sec2026@127.0.0.1:5450/sehatai_staging"\n',
    'DATABASE_URL_UNPOOLED=': 'DATABASE_URL_UNPOOLED="postgresql://sehatai:SehatAI_Staging_9b8a7c6d5e4f3210_Sec2026@127.0.0.1:5450/sehatai_staging"\n',
    'DIRECT_URL=': 'DIRECT_URL="postgresql://sehatai:SehatAI_Staging_9b8a7c6d5e4f3210_Sec2026@127.0.0.1:5450/sehatai_staging"\n',
}

new_lines = []
for line in lines:
    matched = False
    for prefix, repl in updates.items():
        if line.startswith(prefix):
            new_lines.append(repl)
            matched = True
            break
    if not matched:
        new_lines.append(line)

with open('/etc/sehatai/staging.env', 'w') as f:
    f.writelines(new_lines)

print('Updated /etc/sehatai/staging.env successfully.')
