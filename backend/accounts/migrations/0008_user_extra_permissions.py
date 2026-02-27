# Add User.extra_permissions for admin-assignable user-specific permissions
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_merge_20260226'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='extra_permissions',
            field=models.JSONField(blank=True, default=list, help_text='Permission codes granted directly to this user (in addition to role permissions)'),
        ),
    ]
