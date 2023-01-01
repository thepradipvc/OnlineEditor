from django.shortcuts import render, redirect
from django.views.generic import View
from .models import *
import json

# Create your views here.

def index(req):
    msg = '''Hello friends, You can you this platform to share your code with your friends.'''
    return render(req, "index.html", {"code" : msg, "textarea": "hide_textarea", 'show': ['new'], "language": "plaintext"})

def new(req):
    return render(req, "index.html", {'show': ['new', 'save']})


def save(req):
    try:
        codeObj = json.loads(req.body.decode('utf-8'))
        code = codeSchema(language=codeObj['language'], code=codeObj['code'])
        code.save()
    except:
        pass
    return redirect('code_display', code.id)

def code_display(req, id):
    code = codeSchema.objects.get(pk=id)
    return render(req, "index.html", {"code": code.code, "textarea": "hide_textarea", "language": code.language, "id": code.id, 'show': ['new', 'duplicate', 'share']})

def duplicate(req, id):
    code = codeSchema.objects.get(pk=id)
    return render(req, "index.html", {"code": code.code, "language": code.language, 'show': ['new', 'save']})