import sql from "@/app/api/utils/sql";

// Get a specific project with its columns and tasks
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const [project] = await sql`
      SELECT id, name, description, created_date 
      FROM projects 
      WHERE id = ${id}
    `;

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const columns = await sql`
      SELECT id, name, position 
      FROM columns 
      WHERE project_id = ${id}
      ORDER BY position
    `;

    const tasks = await sql`
      SELECT id, column_id, title, description, position, created_date, updated_date
      FROM tasks 
      WHERE project_id = ${id}
      ORDER BY position
    `;

    return Response.json({ project, columns, tasks });
  } catch (error) {
    console.error('Error fetching project:', error);
    return Response.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// Update a project
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, description } = await request.json();
    
    if (!name) {
      return Response.json({ error: 'Project name is required' }, { status: 400 });
    }

    const [project] = await sql`
      UPDATE projects 
      SET name = ${name}, description = ${description || ''}
      WHERE id = ${id}
      RETURNING id, name, description, created_date
    `;

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    return Response.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// Delete a project
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const [project] = await sql`
      DELETE FROM projects 
      WHERE id = ${id}
      RETURNING id
    `;

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return Response.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}