from django.db import models

# Create your models here.
class codeSchema(models.Model):
    language = models.CharField(max_length=20)
    code = models.TextField()