from rest_framework import permissions

class HasAtomicPermission(permissions.BasePermission):
    """
    Custom permission to map HTTP methods to Django's standard 
    view, add, change, and delete permissions automatically.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superusers skip all checks
        if request.user.is_superuser:
            return True

        # Map HTTP methods to standard Django action prefixes
        method_map = {
            'GET': 'view',
            'POST': 'add',
            'PUT': 'change',
            'PATCH': 'change',
            'DELETE': 'delete'
        }
        
        action_prefix = method_map.get(request.method)
        if not action_prefix:
            return False

        # Determine Model name from view's queryset or model parameter
        model_name = None
        if hasattr(view, 'queryset') and view.queryset is not None:
             model_name = view.queryset.model._meta.model_name
        elif hasattr(view, 'get_queryset'):
             # fallback call get_queryset
             try:
                 queryset = view.get_queryset()
                 if queryset is not None:
                     model_name = queryset.model._meta.model_name
             except:
                 pass

        if not model_name:
            # If cannot figure out model, default to allow if authenticated
            # or add safer fallback.
            return True 

        # Format: 'api.view_venta'
        permission_codename = f"api.{action_prefix}_{model_name}"
        
        # Check has_perm
        return request.user.has_perm(permission_codename)
