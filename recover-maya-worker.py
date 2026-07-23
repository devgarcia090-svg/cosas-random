#!/usr/bin/env python3
"""
Descarga el codigo desplegado de un Cloudflare Worker y lo guarda en ./recovered/

Uso:
    export CF_API_TOKEN="tu_token_con_permiso_Workers_Scripts_Read"
    python3 recover-maya-worker.py

Variables opcionales (ya vienen con los valores de tu cuenta por defecto):
    CF_ACCOUNT_ID   (por defecto: c21d634c54dbb741978cf0efd1135bc8)
    CF_SCRIPT_NAME  (por defecto: mayarottweiler)
    OUT_DIR         (por defecto: recovered)

Como sacar el API Token:
    Cloudflare Dashboard -> icono de perfil (arriba dcha) -> "My Profile"
    -> "API Tokens" -> "Create Token" -> plantilla "Edit Cloudflare Workers"
    (o una personalizada con el permiso: Account > Workers Scripts > Read).
"""

import email
import os
import sys
import urllib.request
import urllib.error

ACCOUNT_ID = os.environ.get("CF_ACCOUNT_ID", "c21d634c54dbb741978cf0efd1135bc8")
SCRIPT_NAME = os.environ.get("CF_SCRIPT_NAME", "mayarottweiler")
OUT_DIR = os.environ.get("OUT_DIR", "recovered")
TOKEN = os.environ.get("CF_API_TOKEN")

API = (
    f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}"
    f"/workers/scripts/{SCRIPT_NAME}/content"
)


def die(msg):
    print(f"\n[ERROR] {msg}", file=sys.stderr)
    sys.exit(1)


def main():
    if not TOKEN:
        die("Falta la variable CF_API_TOKEN. Exporta tu token y vuelve a ejecutar.")

    print(f"Descargando '{SCRIPT_NAME}' de la cuenta {ACCOUNT_ID} ...")
    req = urllib.request.Request(API, headers={"Authorization": f"Bearer {TOKEN}"})

    try:
        resp = urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        die(f"HTTP {e.code}: {body}\n"
            "Revisa que el token tenga permiso 'Workers Scripts: Read' y que el "
            "account_id / nombre del worker sean correctos.")
    except urllib.error.URLError as e:
        die(f"No se pudo conectar: {e.reason}")

    content_type = resp.headers.get("Content-Type", "")
    raw = resp.read()

    os.makedirs(OUT_DIR, exist_ok=True)

    if "multipart/form-data" in content_type:
        # Worker de tipo modulos (ES modules): la respuesta trae varios ficheros.
        msg = email.message_from_bytes(
            b"Content-Type: " + content_type.encode() + b"\r\n\r\n" + raw
        )
        count = 0
        for part in msg.walk():
            if part.get_content_maintype() == "multipart":
                continue
            disp = part.get("Content-Disposition", "")
            filename = part.get_filename() or part.get_param("name", header="Content-Disposition")
            if not filename:
                continue
            payload = part.get_payload(decode=True)
            if payload is None:
                continue
            safe = os.path.basename(filename)
            path = os.path.join(OUT_DIR, safe)
            with open(path, "wb") as f:
                f.write(payload)
            print(f"  guardado: {path}  ({len(payload)} bytes)")
            count += 1
        if count == 0:
            die("La respuesta multipart no contenia ficheros reconocibles. "
                f"Content-Type: {content_type}")
    else:
        # Worker de un solo fichero (service-worker classic).
        ext = "js"
        path = os.path.join(OUT_DIR, f"{SCRIPT_NAME}.{ext}")
        with open(path, "wb") as f:
            f.write(raw)
        print(f"  guardado: {path}  ({len(raw)} bytes)")

    print(f"\nListo. Codigo recuperado en la carpeta '{OUT_DIR}/'.")
    print("Nota: los assets estaticos (HTML/CSS/imagenes servidos como Static Assets) "
          "NO se descargan aqui; si el sitio los usa, avisame.")


if __name__ == "__main__":
    main()
