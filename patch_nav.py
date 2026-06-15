#!/usr/bin/env python3
"""
PsyTectrics Nav/Footer Patch — Add Store link
Run this in your website folder: python3 patch_nav.py
"""
import os

def add_store(html):
    # Nav desktop list
    html = html.replace(
        '<li><a href="prototypes.html">Prototypes</a></li>\n    <li><a href="framework.html">',
        '<li><a href="prototypes.html">Prototypes</a></li>\n    <li><a href="store_index.html">Store</a></li>\n    <li><a href="framework.html">'
    )
    html = html.replace(
        '<li><a href="prototypes.html" class="active">Prototypes</a></li>\n    <li><a href="framework.html">',
        '<li><a href="prototypes.html" class="active">Prototypes</a></li>\n    <li><a href="store_index.html">Store</a></li>\n    <li><a href="framework.html">'
    )
    # Mobile drawer
    html = html.replace(
        '<a href="prototypes.html">Prototypes</a>\n  <a href="framework.html">',
        '<a href="prototypes.html">Prototypes</a>\n  <a href="store_index.html">Store</a>\n  <a href="framework.html">'
    )
    # Footer
    html = html.replace(
        '<a href="prototypes.html">Prototypes</a>\n      <a href="framework.html">',
        '<a href="prototypes.html">Prototypes</a>\n      <a href="store_index.html">Store</a>\n      <a href="framework.html">'
    )
    return html

pages = ["index.html", "framework.html", "prototypes.html", "reports.html", "contact.html"]

for page in pages:
    if os.path.exists(page):
        with open(page, "r", encoding="utf-8") as f:
            content = f.read()
        updated = add_store(content)
        if updated != content:
            with open(page, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"✓ Updated: {page}")
        else:
            print(f"- No change (Store already present?): {page}")
    else:
        print(f"! Not found: {page}")

print("\nDone! Refresh your pages.")
