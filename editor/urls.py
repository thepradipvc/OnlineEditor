from . import views
from django.urls import path

urlpatterns = [
    path('', views.index, name="index"),
    path('new', views.new, name="new"),
    path('save', views.save, name='save'),
    path('<int:id>/duplicate', views.duplicate, name="duplicate"),
    path('<int:id>', views.code_display, name="code_display")
]
