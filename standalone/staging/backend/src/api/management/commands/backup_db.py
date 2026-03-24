import os
import subprocess
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Crea un respaldo de la base de datos MySQL'

    def handle(self, *args, **kwargs):
        # 1. Configuración
        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        db_user = db_settings['USER']
        db_password = db_settings['PASSWORD']
        db_host = db_settings['HOST']
        
        # Directorio de respaldos
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
            self.stdout.write(self.style.SUCCESS(f'Directorio creado: {backup_dir}'))

        # Nombre del archivo
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f"backup_{db_name}_{timestamp}.sql"
        filepath = os.path.join(backup_dir, filename)

        # 2. Comando mysqldump
        # Nota: mysqldump debe estar instalado en el sistema (docker container)
        command = [
            'mysqldump',
            f'--host={db_host}',
            f'--user={db_user}',
            f'--password={db_password}',
            f'--result-file={filepath}',
            db_name
        ]

        self.stdout.write(f"Iniciando respaldo de {db_name}...")

        try:
            # Ejecutar comando
            # Usamos subprocess.run para esperar a que termine
            subprocess.run(command, check=True)
            
            self.stdout.write(self.style.SUCCESS(f'Respaldo completado exitosamente: {filepath}'))
            
            # (Opcional) Rotación de respaldos: Eliminar los más antigüos si hay más de 30
            self.cleanup_old_backups(backup_dir)

        except subprocess.CalledProcessError as e:
            self.stdout.write(self.style.ERROR(f'Error al ejecutar mysqldump: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ocurrió un error inesperado: {e}'))

    def cleanup_old_backups(self, backup_dir, keep=30):
        try:
            files = [os.path.join(backup_dir, f) for f in os.listdir(backup_dir) if f.endswith('.sql')]
            files.sort(key=os.path.getmtime) # Ordenar por fecha de modificación (más viejo al inicio)
            
            if len(files) > keep:
                files_to_delete = files[:len(files) - keep]
                for f in files_to_delete:
                    os.remove(f)
                    self.stdout.write(f"Respaldo antiguo eliminado: {f}")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Error al limpiar respaldos antiguos: {e}'))
