import os

for root, _, files in os.walk("app"):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()
            
            if "mapped_column(Uuid" in content:
                # Check if Uuid is imported from sqlalchemy
                lines = content.split('\n')
                imported = False
                for line in lines:
                    if 'import' in line and 'Uuid' in line:
                        imported = True
                        break
                
                if not imported:
                    # Find the last sqlalchemy import and append Uuid
                    for i, line in enumerate(lines):
                        if line.startswith("from sqlalchemy import "):
                            if 'Uuid' not in line:
                                lines[i] = line + ", Uuid"
                            imported = True
                            break
                    if imported:
                        with open(path, "w") as f:
                            f.write('\n'.join(lines))
                        print(f"Fixed {path}")
                    else:
                        print(f"Could not fix {path} automatically")
