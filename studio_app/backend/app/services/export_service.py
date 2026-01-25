import os
import re
import zipfile
import json
import time
from typing import List, Dict
from loguru import logger
from PIL import Image

from app.config import TEMP_DIR
from app.utils import resolve_local_path
from app.models import ExportRequest
from app.services.job_manager import job_manager, JobState

class ExportService:
    """
    Dedicated service for Heavy Duty export operations.
    Designed to be run in background threads/processes.
    """

    def process_export_job(self, job_id: str, request_data: Dict):
        """
        Main worker function for export jobs.
        """
        try:
            job_manager.update_job(job_id, JobState.PROCESSING)
            
            # Extract data from payload
            entity_name = request_data.get("name", "export")
            file_list = request_data.get("files", [])
            format_type = request_data.get("format")
            
            if not file_list:
                raise ValueError("No files to export")

            logger.info(f"📦 Starting Export Job {job_id}: {format_type} for {len(file_list)} files.")
            
            # Execute Logic based on format
            result_path = ""
            safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', entity_name)

            if format_type in ["clean_images", "raw_images"]:
                result_path = self._create_zip_export(safe_name, file_list, format_type)
            
            elif format_type == "json_data":
                result_path = self._create_json_export(safe_name, request_data)
            
            elif format_type == "pdf":
                result_path = self._create_pdf_export(safe_name, file_list)
            
            else:
                raise ValueError(f"Unknown format: {format_type}")

            # Calculate relative path for download URL
            # Assuming TEMP_DIR is mounted as /temp
            filename = os.path.basename(result_path)
            download_url = f"http://localhost:8000/temp/{filename}"
            
            job_manager.update_job(job_id, JobState.COMPLETED, result={
                "downloadUrl": download_url,
                "filename": filename
            })
            logger.info(f"✅ Export Job {job_id} Completed!")

        except Exception as e:
            logger.error(f"❌ Export Job {job_id} Failed: {e}")
            job_manager.update_job(job_id, JobState.FAILED, error=str(e))

    # --- INTERNAL WORKERS ---
    
    def _create_zip_export(self, safe_name: str, files: List[Dict], format_type: str) -> str:
        suffix = "clean" if format_type == "clean_images" else "raw"
        zip_name = f"{safe_name}_{suffix}.zip"
        zip_path = os.path.join(TEMP_DIR, zip_name)
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for p in files:
                path = resolve_local_path(p["url"])
                if os.path.exists(path):
                    # For ZIP, ensure we have an extension
                    fname = p["name"]
                    if not fname.lower().endswith(('.jpg', '.png')): fname += ".jpg"
                    zipf.write(path, arcname=fname)
        return zip_path

    def _create_json_export(self, safe_name: str, payload: Dict) -> str:
        json_name = f"{safe_name}_data.json"
        json_path = os.path.join(TEMP_DIR, json_name)
        
        # Remove internal noise if needed, or dump as is
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        return json_path

    def _create_pdf_export(self, safe_name: str, files: List[Dict]) -> str:
        pdf_name = f"{safe_name}.pdf"
        pdf_path = os.path.join(TEMP_DIR, pdf_name)
        imgs = []
        
        for p in files:
            path = resolve_local_path(p["url"])
            if os.path.exists(path):
                try:
                    # Open and convert to RGB (PDF requirement)
                    img = Image.open(path).convert("RGB")
                    imgs.append(img)
                except Exception as e:
                    logger.warning(f"Skipping bad image in PDF: {path} - {e}")
        
        if not imgs:
            raise ValueError("No valid images found for PDF generation")
            
        imgs[0].save(pdf_path, "PDF", save_all=True, append_images=imgs[1:])
        return pdf_path

export_service = ExportService()
