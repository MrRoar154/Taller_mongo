#!/usr/bin/env python3
"""Carga las 15 casas desarrolladoras de software de Villavicencio en MongoDB.

Uso:
    python cargar_casas.py            # carga desde datos_casas.json
    python cargar_casas.py --scrape   # intenta completar imagenUrl faltantes
    python cargar_casas.py --mock     # usa mongomock (sin servidor) para pruebas
Variable de entorno opcional: MONGO_URI (por defecto mongodb://localhost:27017)
"""
import argparse
import json
import os
import sys
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

BASE = Path(__file__).resolve().parent
ARCHIVO_DATOS = BASE / "datos_casas.json"


def normalizar(texto):
    """Minúsculas, sin tildes y sin espacios sobrantes."""
    sin_tildes = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return " ".join(sin_tildes.lower().split())


def url_valida(url):
    """Devuelve True si la URL responde con código HTTP < 400."""
    import requests
    try:
        r = requests.get(url, timeout=10, allow_redirects=True,
                         headers={"User-Agent": "Mozilla/5.0"}, stream=True)
        return r.status_code < 400
    except requests.RequestException:
        return False


def buscar_imagen(sitio):
    """Lee og:image (o el favicon) de la página oficial con requests + BeautifulSoup."""
    import requests
    from bs4 import BeautifulSoup
    try:
        r = requests.get(sitio, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"   ⚠ No se pudo leer {sitio}: {e}")
        return None
    sopa = BeautifulSoup(r.text, "html.parser")
    candidatos = []
    og = sopa.find("meta", property="og:image")
    if og and og.get("content"):
        candidatos.append(og["content"])
    for link in sopa.find_all("link", rel=True):
        if any("icon" in v.lower() for v in link["rel"]) and link.get("href"):
            candidatos.append(link["href"])
    candidatos.append("/favicon.ico")
    for c in candidatos:
        absoluta = urljoin(r.url, c)
        if url_valida(absoluta):
            return absoluta
    return None


def completar_con_scraping(casa):
    """Completa la imagen faltante si hay sitioWeb. No inventa sitios web."""
    if casa.get("sitioWeb") and not casa.get("imagenUrl"):
        print(f" - Buscando imagen para {casa['nombre']}...")
        img = buscar_imagen(casa["sitioWeb"])
        if img:
            casa["imagenUrl"] = img
            casa["fuente"] += " | imagen obtenida con --scrape"
    return casa


def construir_documento(casa):
    """Documento según el contrato API v1 (nota/fuente se quedan solo en el JSON)."""
    return {
        "nombre": casa["nombre"],
        "direccion": casa["direccion"],
        "especialidad": casa["especialidad"],
        "imagenUrl": casa.get("imagenUrl") or None,
        "sitioWeb": casa.get("sitioWeb") or None,
        "nombreBusqueda": normalizar(casa["nombre"]),
    }


def obtener_coleccion(usar_mock):
    uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    if usar_mock:
        import mongomock
        cliente = mongomock.MongoClient()
        print("Usando mongomock (base en memoria, solo para pruebas).")
    else:
        from pymongo import MongoClient
        cliente = MongoClient(uri, serverSelectionTimeoutMS=5000)
        cliente.admin.command("ping")  # falla rápido si no hay servidor
        print(f"Conectado a {uri}")
    return cliente["directorio"]["casas"]


def main():
    p = argparse.ArgumentParser(description="Carga casas de software en MongoDB")
    p.add_argument("--scrape", action="store_true", help="completar imágenes faltantes desde la web")
    p.add_argument("--mock", action="store_true", help="usar mongomock en lugar de un servidor real")
    args = p.parse_args()

    casas = json.loads(ARCHIVO_DATOS.read_text(encoding="utf-8"))
    print(f"Leídas {len(casas)} casas de {ARCHIVO_DATOS.name}")
    if args.scrape:
        casas = [completar_con_scraping(c) for c in casas]

    try:
        col = obtener_coleccion(args.mock)
    except Exception as e:
        sys.exit(f"Error: no se pudo conectar a MongoDB ({e})")

    col.create_index("nombreBusqueda", unique=True)
    insertados = actualizados = sin_cambios = 0
    for casa in casas:
        doc = construir_documento(casa)
        res = col.update_one(
            {"nombreBusqueda": doc["nombreBusqueda"]},
            {"$set": doc},
            upsert=True,
        )
        if res.upserted_id is not None:
            insertados += 1
        elif res.modified_count:
            actualizados += 1
        else:
            sin_cambios += 1

    print("\n=== Resumen ===")
    print(f"Insertados:   {insertados}")
    print(f"Actualizados: {actualizados}")
    print(f"Sin cambios:  {sin_cambios}")
    print(f"Total en la colección: {col.count_documents({})}")


if __name__ == "__main__":
    main()
