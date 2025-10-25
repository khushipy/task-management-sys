import sql from "@/app/api/utils/sql";

// Move task between columns (for drag and drop)
export async function PUT(request) {
  try {
    const { taskId, newColumnId, newPosition } = await request.json();
    
    if (!taskId || !newColumnId || newPosition === undefined) {
      return Response.json({ 
        error: 'Task ID, new column ID, and new position are required' 
      }, { status: 400 });
    }

    // Get current task info
    const [currentTask] = await sql`
      SELECT column_id, position FROM tasks WHERE id = ${taskId}
    `;

    if (!currentTask) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    const result = await sql.transaction(async (txn) => {
      // If moving within the same column, adjust positions
      if (currentTask.column_id === newColumnId) {
        if (newPosition > currentTask.position) {
          // Moving down - decrease positions of tasks in between
          await txn`
            UPDATE tasks 
            SET position = position - 1 
            WHERE column_id = ${newColumnId} 
            AND position > ${currentTask.position} 
            AND position <= ${newPosition}
          `;
        } else if (newPosition < currentTask.position) {
          // Moving up - increase positions of tasks in between
          await txn`
            UPDATE tasks 
            SET position = position + 1 
            WHERE column_id = ${newColumnId} 
            AND position >= ${newPosition} 
            AND position < ${currentTask.position}
          `;
        }
      } else {
        // Moving to different column
        // Decrease positions in old column
        await txn`
          UPDATE tasks 
          SET position = position - 1 
          WHERE column_id = ${currentTask.column_id} 
          AND position > ${currentTask.position}
        `;
        
        // Increase positions in new column
        await txn`
          UPDATE tasks 
          SET position = position + 1 
          WHERE column_id = ${newColumnId} 
          AND position >= ${newPosition}
        `;
      }

      // Update the moved task
      const [updatedTask] = await txn`
        UPDATE tasks 
        SET column_id = ${newColumnId}, position = ${newPosition}, updated_date = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
        RETURNING id, project_id, column_id, title, description, position, created_date, updated_date
      `;

      return updatedTask;
    });

    return Response.json({ task: result });
  } catch (error) {
    console.error('Error moving task:', error);
    return Response.json({ error: 'Failed to move task' }, { status: 500 });
  }
}