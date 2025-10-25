import sql from "@/app/api/utils/sql";

// AI summarize project tasks
export async function POST(request) {
  try {
    const { projectId } = await request.json();
    
    if (!projectId) {
      return Response.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project and tasks data
    const [project] = await sql`
      SELECT name, description FROM projects WHERE id = ${projectId}
    `;

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const tasks = await sql`
      SELECT t.title, t.description, c.name as column_name
      FROM tasks t
      JOIN columns c ON t.column_id = c.id
      WHERE t.project_id = ${projectId}
      ORDER BY c.position, t.position
    `;

    // Prepare data for AI
    const tasksByColumn = {};
    tasks.forEach(task => {
      if (!tasksByColumn[task.column_name]) {
        tasksByColumn[task.column_name] = [];
      }
      tasksByColumn[task.column_name].push({
        title: task.title,
        description: task.description
      });
    });

    const projectData = {
      name: project.name,
      description: project.description,
      tasksByColumn
    };

    // Call Gemini AI for summarization
    const aiResponse = await fetch('/integrations/google-gemini-2-5-pro/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Please provide a comprehensive summary of this project and its tasks. 

Project: ${project.name}
Description: ${project.description}

Tasks organized by status:
${Object.entries(tasksByColumn).map(([column, tasks]) => 
  `${column}:\n${tasks.map(task => `- ${task.title}: ${task.description}`).join('\n')}`
).join('\n\n')}

Please provide:
1. Overall project status and progress
2. Key accomplishments (completed tasks)
3. Current work in progress
4. Upcoming tasks and priorities
5. Any potential blockers or concerns`
        }]
      })
    });

    if (!aiResponse.ok) {
      throw new Error('AI service unavailable');
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;

    return Response.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return Response.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}