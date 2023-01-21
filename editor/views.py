from django.shortcuts import render, redirect
from django.views.generic import View
from .models import *
import json

# Create your views here.

def index(req):
    msg = '''Hello friends, You can use this platform to share your code with your friends.\nYou do not need to login to share the code with your friend.\nHow to share code easily?\n1. Write code by selecting a language.\n2. Save the code.\n3. After saving the code enter the 6 digit number of your friend in the box at the top.\n5. Click on share button and enter your name if you want to show your name to your friend.\nCongrats! You have successfully sent the code to your friend.\nNow he/she will recieve a notification and she can open your code by clicking on it.'''
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
    try:
        code = codeSchema.objects.get(pk=id)
        return render(req, "index.html", {"code": code.code, "textarea": "hide_textarea", "language": code.language, "id": code.id, 'show': ['new', 'duplicate', 'share']})
    except:
        return render(req, "404.html", status=404)

def duplicate(req, id):
    try:
        code = codeSchema.objects.get(pk=id)
        return render(req, "index.html", {"code": code.code, "language": code.language, 'show': ['new', 'save']})
    except:
        return render(req, "404.html", status=404)