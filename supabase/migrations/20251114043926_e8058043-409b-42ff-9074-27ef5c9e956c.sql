
-- Grant blog_management and careers_management permissions to i-sidi@hryzn.org
-- This will allow them to see and access the Blog and Careers sections in Admin Hub

INSERT INTO public.admin_permissions (user_id, permission, granted_by)
VALUES 
  (
    (SELECT id FROM auth.users WHERE email = 'i-sidi@hryzn.org'),
    'blog_management',
    (SELECT id FROM auth.users WHERE email = 'support@joinfinlo.ai')
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'i-sidi@hryzn.org'),
    'careers_management',
    (SELECT id FROM auth.users WHERE email = 'support@joinfinlo.ai')
  )
ON CONFLICT (user_id, permission) DO NOTHING;
