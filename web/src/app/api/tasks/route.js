import sql from "@/app/api/utils/sql";

// Create a new task
export async function POST(request) {
  try {
    const { project_id, column_id, title, description } = await request.json();
    
    if (!project_id || !column_id || !title) {
      return Response.json({ 
        error: 'Project ID, column ID, and title are required' 
      }, { status: 400 });
    }

    // Get the next position for this column
    const [positionResult] = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 as next_position
      FROM tasks 
      WHERE column_id = ${column_id}
    `;

    const [task] = await sql`
      INSERT INTO tasks (project_id, column_id, title, description, position)
      VALUES (${project_id}, ${column_id}, ${title}, ${description || ''}, ${positionResult.next_position})
      RETURNING id, project_id, column_id, title, description, position, created_date, updated_date
    `;

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return Response.json({ error: 'Failed to create task' }, { status: 500 });
  }
}