import sql from "@/app/api/utils/sql";

// Update a task
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, description, column_id, position } = await request.json();
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (column_id !== undefined) {
      updates.push(`column_id = $${paramCount}`);
      values.push(column_id);
      paramCount++;
    }

    if (position !== undefined) {
      updates.push(`position = $${paramCount}`);
      values.push(position);
      paramCount++;
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_date = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE tasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, project_id, column_id, title, description, position, created_date, updated_date
    `;

    const [task] = await sql(query, values);

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    return Response.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return Response.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// Delete a task
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const [task] = await sql`
      DELETE FROM tasks 
      WHERE id = ${id}
      RETURNING id
    `;

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    return Response.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return Response.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}