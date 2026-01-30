import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

OUTPUT_FILENAME = "MONSTRO_1000_PAGES.pdf"
PAGES = 1000

def generate_monster_pdf():
    print(f"🦖 Gerando Monstro de {PAGES} páginas...")
    c = canvas.Canvas(OUTPUT_FILENAME, pagesize=A4)
    width, height = A4

    for i in range(1, PAGES + 1):
        # Draw huge number
        c.setFont("Helvetica-Bold", 100)
        text = str(i)
        text_width = c.stringWidth(text, "Helvetica-Bold", 100)
        c.drawString((width - text_width) / 2, height / 2, text)
        
        # Add some shapes to make it not too simple (force compression/rendering work)
        c.setLineWidth(5)
        c.rect(50, 50, width - 100, height - 100)
        c.circle(width/2, height/4, 50)
        
        c.showPage()
        
        if i % 100 == 0:
            print(f"   ... {i} páginas desenhadas")

    c.save()
    print(f"✅ {OUTPUT_FILENAME} gerado com sucesso!")
    print(f"📍 Local: {os.path.abspath(OUTPUT_FILENAME)}")

if __name__ == "__main__":
    generate_monster_pdf()
