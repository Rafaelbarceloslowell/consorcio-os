import hashlib
import json
import os
import sys


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def main():
    folder = os.path.dirname(os.path.abspath(__file__))
    output = os.path.join(folder, "artifact-manifest.json")
    files = []
    for name in sorted(os.listdir(folder)):
        path = os.path.join(folder, name)
        if name == "artifact-manifest.json" or not os.path.isfile(path):
            continue
        files.append({"name": name, "size_bytes": os.path.getsize(path), "sha256": sha256(path)})
    manifest = {"schema_version": 1, "root_folder": os.path.basename(folder), "file_count": len(files), "files": files}
    with open(output, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(manifest, handle, indent=2, ensure_ascii=False, sort_keys=True)
        handle.write("\n")
    print("ManifestCreated=True")
    print("ManifestFileCount=" + str(len(files)))


if __name__ == "__main__":
    main()
