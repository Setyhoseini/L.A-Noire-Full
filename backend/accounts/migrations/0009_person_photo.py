from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_add_interrogation_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='person',
            name='photo',
            field=models.ImageField(blank=True, null=True, upload_to='persons/%Y/%m/%d'),
        ),
    ]
