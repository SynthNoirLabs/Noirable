import json

filepath = "src/lib/templates/index.ts"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace("as any", "as unknown as A2UIInput")

with open(filepath, "w") as f:
    f.write(content)
