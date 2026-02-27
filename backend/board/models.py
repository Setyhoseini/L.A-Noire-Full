from django.db import models


class CaseBoard(models.Model):
    """Stores React Flow board state (nodes, edges) per case."""
    case = models.OneToOneField(
        'cases.Case', on_delete=models.CASCADE, related_name='board'
    )
    nodes = models.JSONField(default=list)  # React Flow nodes
    edges = models.JSONField(default=list)  # React Flow edges
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Board for {self.case.case_number}"
