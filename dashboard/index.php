<?php 
// Obfuscated admin dashboard (security through obscurity)
require '../config.php'; 

// Check for admin session or token
$isAdmin = (isset($_SESSION['admin']) && $_SESSION['admin'] === true);
$hasToken = isset($_GET['v']) && $_GET['v'] === hash('sha256', ADMIN_EMAIL . ADMIN_PASS_HASH);

if (!$isAdmin && !$hasToken) {
    if (isset($_POST['email']) && isset($_POST['pass'])) {
        if ($_POST['email'] === ADMIN_EMAIL && password_verify($_POST['pass'], ADMIN_PASS_HASH)) {
            $_SESSION['admin'] = true;
            $isAdmin = true;
        } else {
            $error = "Invalid credentials";
        }
    }
}

if (!$isAdmin && !$hasToken) {
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg:          #0a0a0f;
            --surface:     #111118;
            --border:      rgba(255,255,255,0.07);
            --accent:      #7c5cfc;
            --accent-glow: rgba(124,92,252,0.35);
            --accent-soft: rgba(124,92,252,0.12);
            --text:        #f0eeff;
            --muted:       #6b6880;
            --danger:      #ff4d6d;
            --danger-soft: rgba(255,77,109,0.12);
            --input-bg:    rgba(255,255,255,0.04);
            --input-border:rgba(255,255,255,0.1);
        }

        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--bg);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text);
            overflow-x: hidden;
        }

        body::before {
            content: '';
            position: fixed;
            width: 600px; height: 600px;
            background: radial-gradient(circle, rgba(124,92,252,0.13) 0%, transparent 70%);
            top: -250px; right: -200px;
            pointer-events: none; z-index: 0;
        }

        .login-wrap {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 420px;
            padding: 1.5rem;
            animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes rise {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 2.5rem;
        }

        .brand-icon {
            width: 44px; height: 44px;
            background: var(--accent);
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.2rem;
            box-shadow: 0 0 24px var(--accent-glow);
            flex-shrink: 0;
        }

        .brand-text h1 {
            font-family: 'Syne', sans-serif;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.2;
        }

        .brand-text small {
            font-size: 0.7rem;
            color: var(--muted);
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }

        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 2.5rem;
            box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
        }

        .card-title {
            font-family: 'Syne', sans-serif;
            font-size: 1.6rem;
            font-weight: 700;
            letter-spacing: -0.03em;
            margin-bottom: 0.35rem;
        }

        .card-sub {
            color: var(--muted);
            font-size: 0.875rem;
            margin-bottom: 2rem;
        }

        .error-msg {
            background: var(--danger-soft);
            border: 1px solid rgba(255,77,109,0.3);
            color: #ff8099;
            font-size: 0.85rem;
            padding: 0.75rem 1rem;
            border-radius: 10px;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .field { margin-bottom: 1.25rem; }

        .field label {
            display: block;
            font-size: 0.78rem;
            font-weight: 500;
            color: var(--muted);
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }

        .input-wrap { position: relative; }

        .input-wrap i {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--muted);
            font-size: 0.875rem;
            pointer-events: none;
            z-index: 1;
            transition: color 0.2s;
        }

        .input-wrap input {
            width: 100%;
            padding: 0.875rem 1rem 0.875rem 2.75rem;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 12px;
            color: var(--text);
            font-family: 'DM Sans', sans-serif;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .input-wrap input::placeholder { color: var(--muted); }

        .input-wrap input:focus {
            border-color: var(--accent);
            background: var(--accent-soft);
            box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .input-wrap:has(input:focus) i { color: var(--accent); }

        .btn-submit {
            width: 100%;
            padding: 0.9rem;
            margin-top: 0.5rem;
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 12px;
            font-family: 'Syne', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
            box-shadow: 0 4px 20px var(--accent-glow);
        }

        .btn-submit:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 30px var(--accent-glow);
            filter: brightness(1.08);
        }

        .btn-submit:active { transform: translateY(0); }

        @media (max-width: 480px) {
            .login-wrap { padding: 1rem; }
            .card { padding: 1.75rem; }
            .brand { margin-bottom: 2rem; }
            .card-title { font-size: 1.35rem; }
        }
    </style>
</head>
<body>
    <div class="login-wrap">
        <div class="brand">
            <div class="brand-icon"><i class="fas fa-chart-line"></i></div>
            <div class="brand-text">
                <h1>System Dashboard</h1>
                <small>Restricted access</small>
            </div>
        </div>

        <div class="card">
            <h2 class="card-title">Access Required</h2>
            <p class="card-sub">Enter your credentials to access the system dashboard</p>

            <?php if(isset($error)): ?>
            <div class="error-msg">
                <i class="fas fa-exclamation-circle"></i>
                <?php echo $error; ?>
            </div>
            <?php endif; ?>

            <form method="POST">
                <div class="field">
                    <label>Email</label>
                    <div class="input-wrap">
                        <i class="fas fa-envelope"></i>
                        <input type="email" name="email" placeholder="admin@example.com" required>
                    </div>
                </div>
                <div class="field">
                    <label>Password</label>
                    <div class="input-wrap">
                        <i class="fas fa-lock"></i>
                        <input type="password" name="pass" placeholder="••••••••" required>
                    </div>
                </div>
                <button type="submit" class="btn-submit">
                    <i class="fas fa-sign-in-alt"></i> Access Dashboard
                </button>
            </form>
        </div>
    </div>
</body>
</html>
<?php exit; } ?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg:          #0a0a0f;
            --surface:     #111118;
            --surface2:    #16161f;
            --border:      rgba(255,255,255,0.07);
            --accent:      #7c5cfc;
            --accent-glow: rgba(124,92,252,0.3);
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
            flex-shrink: 0;
        }

        .brand-icon {
            width: 36px; height: 36px;
            background: var(--accent);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1rem;
            box-shadow: 0 0 18px var(--accent-glow);
        }

        .brand-name {
            font-family: 'Syne', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            letter-spacing: -0.02em;
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
            font-weight: 500;
            text-decoration: none;
            color: var(--text2);
            border: 1px solid transparent;
            transition: background 0.2s, color 0.2s;
        }

        .nav a:hover {
            background: var(--accent-soft);
            color: var(--text);
        }

        .nav a.logout {
            color: #ff8099;
        }

        .content {
            position: relative;
            z-index: 1;
            padding: 2rem 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .welcome {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .welcome-icon {
            width: 52px; height: 52px;
            background: var(--accent-soft);
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem;
            color: var(--accent);
        }

        .welcome h2 {
            font-family: 'Syne', sans-serif;
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 0.2rem;
        }

        .welcome p { font-size: 0.875rem; color: var(--text2); }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            text-decoration: none;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 36px rgba(0,0,0,0.3);
        }

        .card-icon {
            width: 42px; height: 42px;
            background: var(--accent-soft);
            border-radius: 11px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem;
            color: var(--accent);
            flex-shrink: 0;
        }

        .card h3 {
            font-family: 'Syne', sans-serif;
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 0.15rem;
        }

        .card p {
            font-size: 0.78rem;
            color: var(--muted);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .stat-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
        }

        .stat-card .value {
            font-family: 'Syne', sans-serif;
            font-size: 2rem;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 0.5rem;
        }

        .stat-card .label {
            font-size: 0.875rem;
            color: var(--muted);
        }
    </style>
</head>
<body>
    <div class="topbar">
        <div class="brand">
            <div class="brand-icon"><i class="fas fa-chart-line"></i></div>
            <span class="brand-name">System Dashboard</span>
        </div>
        <nav class="nav">
            <a href="metrics.php"><i class="fas fa-chart-bar"></i> Metrics</a>
            <a href="logs.php"><i class="fas fa-list"></i> Logs</a>
            <a href="../?logout=1" class="logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </nav>
    </div>

    <div class="content">
        <div class="welcome">
            <div class="welcome-icon"><i class="fas fa-tachometer-alt"></i></div>
            <div>
                <h2>System Overview</h2>
                <p>Real-time system metrics and monitoring</p>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="value" id="total-packets">0</div>
                <div class="label">Total Packets</div>
            </div>
            <div class="stat-card">
                <div class="value" id="active-users">0</div>
                <div class="label">Active Users</div>
            </div>
            <div class="stat-card">
                <div class="value" id="error-count">0</div>
                <div class="label">Errors</div>
            </div>
            <div class="stat-card">
                <div class="value" id="sync-rate">0%</div>
                <div class="label">Sync Success Rate</div>
            </div>
        </div>

        <div class="grid">
            <a href="metrics.php" class="card">
                <div class="card-icon"><i class="fas fa-chart-bar"></i></div>
                <div>
                    <h3>Metrics</h3>
                    <p>View detailed system metrics</p>
                </div>
            </a>
            <a href="logs.php" class="card">
                <div class="card-icon"><i class="fas fa-list"></i></div>
                <div>
                    <h3>Logs</h3>
                    <p>System and audit logs</p>
                </div>
            </a>
            <a href="users.php" class="card">
                <div class="card-icon"><i class="fas fa-users"></i></div>
                <div>
                    <h3>Users</h3>
                    <p>User management</p>
                </div>
            </a>
        </div>
    </div>

    <script>
        // Load dashboard stats
        async function loadStats() {
            try {
                const response = await fetch('../server/api/dashboard.js');
                // Stats loading logic
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }
        
        loadStats();
    </script>
</body>
</html>
