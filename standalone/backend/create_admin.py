import os
import django

import sys
sys.path.append('src')

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

try:
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin'

    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username, email, password)
        print(f"SUCCESS: Superuser '{username}' created with password '{password}'.")
    else:
        u = User.objects.get(username=username)
        u.set_password(password)
        u.save()
        print(f"SUCCESS: Superuser '{username}' already existed. Password reset to '{password}'.")

except Exception as e:
    print(f"ERROR: Could not create superuser. Details: {e}")
