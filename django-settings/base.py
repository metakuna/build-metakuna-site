import django

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates', 'temp'],
        'APP_DIRS': True,
    },
]
SECRET_KEY = '8lu*6g0lg)9z!ba+a$ehk)xt)x%rxgb$i1&amp;022shmi1jcgihb*'
django.setup()