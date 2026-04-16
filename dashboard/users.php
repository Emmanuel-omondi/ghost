<?php 
require '../config.php'; 
if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
    header('Location: index.php'); exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Management</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        :root {
            --bg:          #0a0a0f;
            --surface:     #111118;
            --border:      rgba(255,255,255,0.07);
            --accent:      #7c5cfc;
            --accent-soft: rgba(124,92,252,0.1);
            --text:        #f0eeff;
            --text2:       #b8b4d0;
            --muted:       #5a5670;
        }

        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
        }

        .topbar {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 0 1.5rem;
            height: 62px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 0.65rem;
        }

        .brand-icon {
            width: 36px; height: 36px;
            background: var(--accent);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1rem;
        }

        .brand-name {
            font-family: 'Syne', sans-serif;
            font-size: 1rem;
            font-weight: 700;
        }

        .nav {
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .nav a {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 1rem;
            border-radius: 9px;
            font-size: 0.875rem;
            text-decoration: none;
            color: var(--text2);
            transition: background 0.2s;
        }

        .nav a:hover {
            background: var(--accent-soft);
            color: var(--text);
        }

        .content {
            padding: 2rem 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .header h1 {
            font-family: 'Syne', sans-serif;
            font-size: 1.8rem;
            font-weight: 700;
        }

        .table-container {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: rgba(255,255,255,0.02);
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.875rem;
            color: var(--muted);
            border-bottom: 1px solid var(--border);
        }

        td {
            padding: 1rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.875rem;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover {
            background: rgba(255,255,255,0.02);
        }

        .btn {
            padding: 0.4rem 0.8rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.75rem;
            transition: background 0.2s;
        }

        .btn-primary {
            background: var(--accent);
            color: white;
        }

        .btn-primary:hover {
            background: #6b4ce6;
        }

        .btn-danger {
            background: #ff4d6d;
            color: white;
        }

        .btn-danger:hover {
            background: #ff2d4d;
        }
    </style>
</head>
<body>
    <div class="topbar">
        <div class="brand">
            <div class="brand-icon"><i class="fas fa-users"></i></div>
            <span class="brand-name">User Management</span>
        </div>
        <nav class="nav">
            <a href="index.php"><i class="fas fa-home"></i> Dashboard</a>
            <a href="metrics.php"><i class="fas fa-chart-bar"></i> Metrics</a>
            <a href="logs.php"><i class="fas fa-list"></i> Logs</a>
            <a href="../?logout=1"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </nav>
    </div>

    <div class="content">
        <div class="header">
            <h1><i class="fas fa-users"></i> User Management</h1>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Status</th>
                        <th>License Expiry</th>
                        <th>Last Activity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="users-table">
                    <tr>
                        <td colspan="5" style="text-align: center; color: var(--muted);">Loading users...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Load users
        async function loadUsers() {
            try {
                // Users loading logic
                console.log('Loading users...');
            } catch (error) {
                console.error('Error loading users:', error);
            }
        }
        
        loadUsers();
    </script>
</body>
</html>
