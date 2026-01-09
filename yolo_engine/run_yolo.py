import sys
import json
import traceback
import os
import contextlib
import io
from ultralytics import YOLO
import numpy as np

def run():
    try:
        # 1. Validação
        if len(sys.argv) < 2:
            # Imprime erro direto pois não iniciamos o silenciador ainda
            print(json.dumps({"status": "error", "message": "Sem imagem"}))
            return

        image_path = sys.argv[1]
        
        # Robust Logic: Determine absolute path for model
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_name = 'comic_speech_bubble_seg_v1.pt'
        model_path = os.path.join(script_dir, model_name)
        
        # Fallback to generic if custom doesn't exist
        if not os.path.exists(model_path):
             model_path = "yolov8n-seg.pt"

        # 2. Execução SILENCIOSA (O Pulo do Gato) 🤫
        # Redirecionamos o stdout para o nada durante o carregamento e predição
        with contextlib.redirect_stdout(io.StringIO()):
            model = YOLO(model_path)
            
            # Setup output dir properly
            output_dir_base = os.path.join(script_dir, "output")
            
            # save=True ainda salva o arquivo, mas o aviso no terminal é engolido
            results = model.predict(
                source=image_path, 
                save=True, 
                conf=0.15, 
                verbose=False,
                project=output_dir_base,
                name="inference",
                exist_ok=True
            )
        
        if not results:
            print(json.dumps({"status": "success", "balloons": [], "message": "Sem resultados"}))
            return
            
        result = results[0].cpu()
        
        # Tratamento de caminho seguro
        output_dir = result.save_dir if result.save_dir else "output_saved"
        
        balloons = []
        
        # 3. Processamento dos Dados
        if result.boxes:
            for i, box in enumerate(result.boxes):
                conf = float(box.conf)
                
                # Filter low confidence if needed
                if conf < 0.15:
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                w, h = x2 - x1, y2 - y1
                
                # Fallback: Quadrado
                polygon = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
                
                # Tenta Máscara
                if result.masks is not None:
                    try:
                        if hasattr(result.masks, 'xy') and len(result.masks.xy) > i:
                            raw_poly = result.masks.xy[i]
                            if len(raw_poly) > 0:
                                polygon = raw_poly.tolist()
                    except:
                        pass
                
                balloons.append({
                    "id": i,
                    "conf": round(conf, 2),
                    "box": [x1, y1, w, h],
                    "polygon": polygon
                })
                
        # 4. Saída JSON Limpa
        # Agora sim, imprimimos a ÚNICA coisa que o frontend vai ler
        response = {
            "status": "success",
            "image_output": output_dir,
            "balloons": balloons,
            "count": len(balloons)
        }
        
        # Print final limpo
        sys.stdout.write(json.dumps(response))
        
    except Exception as e:
        # Log de arquivo para erros fatais
        script_dir_err = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(script_dir_err, "debug_fatal_error.txt"), "w") as f:
            f.write(str(e) + "\n" + traceback.format_exc())
            
        # Tenta retornar erro JSON se possível
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    run()
