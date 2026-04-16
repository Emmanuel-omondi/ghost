<?php 
require '../config.php'; 
if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
    if (isset($_POST['admin_email']) && $_POST['admin_email'] === ADMIN_EMAIL && 
        password_verify($_POST['admin_pass'], ADMIN_PASS_HASH)) {
        $_SESSION['admin'] = true;
    } else {
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin — GhostMonitor</title>
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

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

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
        body::after {
            content: '';
            position: fixed;
            width: 480px; height: 480px;
            background: radial-gradient(circle, rgba(80,50,180,0.08) 0%, transparent 70%);
            bottom: -180px; left: -120px;
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

        /* ── Brand ── */
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

        .badge {
            display: inline-block;
            background: var(--danger-soft);
            border: 1px solid rgba(255,77,109,0.25);
            color: #ff8099;
            font-size: 0.62rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0.18rem 0.45rem;
            border-radius: 4px;
            margin-left: 0.4rem;
            vertical-align: middle;
        }

        /* ── Card ── */
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

        /* ── Error ── */
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

        /* ── Fields ── */
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

        /* ── Button ── */
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

        /* ── Divider ── */
        .divider {
            border: none;
            border-top: 1px solid var(--border);
            margin: 1.75rem 0 1.25rem;
        }

        .back-link {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            font-size: 0.83rem;
            color: var(--muted);
            text-decoration: none;
            transition: color 0.2s;
        }

        .back-link:hover { color: var(--accent); }

        /* ── Responsive ── */
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
            <div class="brand-icon"><i class="fas fa-ghost"></i></div>
            <div class="brand-text">
                <h1>GhostMonitor <span class="badge">Admin</span></h1>
                <small>Restricted access</small>
            </div>
        </div>

        <div class="card">
            <h2 class="card-title">Administrator login</h2>
            <p class="card-sub">Enter your credentials to access the admin panel</p>

            <?php if(isset($_POST['admin_email'])): ?>
            <div class="error-msg">
                <i class="fas fa-exclamation-circle"></i>
                Invalid credentials. Access denied.
            </div>
            <?php endif; ?>

            <form method="POST">
                <div class="field">
                    <label>Admin email</label>
                    <div class="input-wrap">
                        <i class="fas fa-envelope"></i>
                        <input type="email" name="admin_email" placeholder="admin@example.com" required>
                    </div>
                </div>
                <div class="field">
                    <label>Password</label>
                    <div class="input-wrap">
                        <i class="fas fa-lock"></i>
                        <input type="password" name="admin_pass" placeholder="••••••••" required>
                    </div>
                </div>
                <button type="submit" class="btn-submit">
                    <i class="fas fa-shield-alt"></i> Authenticate
                </button>
            </form>

            <hr class="divider">
            <a href="../login.php" class="back-link">
                <i class="fas fa-arrow-left"></i> Back to parent login
            </a>
        </div>
    </div>
</body>
</html>
<?php exit; } } ?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel — GhostMonitor</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg:          #0a0a0f;
            --surface:     #111118;
            --surface2:    #16161f;
            --border:      rgba(255,255,255,0.07);
            --border2:     rgba(255,255,255,0.04);
            --accent:      #7c5cfc;
            --accent-glow: rgba(124,92,252,0.3);
            --accent-soft: rgba(124,92,252,0.1);
            --text:        #f0eeff;
            --text2:       #b8b4d0;
            --muted:       #5a5670;
            --danger:      #ff4d6d;
            --danger-soft: rgba(255,77,109,0.1);
        }

        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
        }

        body::before {
            content: '';
            position: fixed;
            width: 600px; height: 600px;
            background: radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 65%);
            top: -200px; right: -150px;
            pointer-events: none; z-index: 0;
        }

        /* ── Top bar ── */
        .admin-topbar {
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
            gap: 1rem;
        }

        .admin-brand {
            display: flex;
            align-items: center;
            gap: 0.65rem;
            flex-shrink: 0;
            min-width: 0;
        }

        .brand-icon {
            width: 36px; height: 36px;
            background: var(--accent);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1rem;
            box-shadow: 0 0 18px var(--accent-glow);
            flex-shrink: 0;
        }

        .brand-name {
            font-family: 'Syne', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            white-space: nowrap;
        }

        .badge-admin {
            display: inline-block;
            background: var(--danger-soft);
            border: 1px solid rgba(255,77,109,0.22);
            color: #ff8099;
            font-size: 0.6rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0.17rem 0.42rem;
            border-radius: 4px;
            margin-left: 0.35rem;
            vertical-align: middle;
            flex-shrink: 0;
        }

        /* ── Nav links ── */
        .admin-nav {
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .admin-nav a {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 1rem;
            border-radius: 9px;
            font-family: 'DM Sans', sans-serif;
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            color: var(--text2);
            border: 1px solid transparent;
            transition: background 0.2s, color 0.2s, border-color 0.2s;
            white-space: nowrap;
        }

        .admin-nav a:hover {
            background: var(--accent-soft);
            color: var(--text);
            border-color: rgba(124,92,252,0.2);
        }

        .admin-nav a.active {
            background: var(--accent-soft);
            color: var(--accent);
            border-color: rgba(124,92,252,0.25);
        }

        .admin-nav a.logout {
            color: var(--danger);
            border-color: rgba(255,77,109,0.2);
        }

        .admin-nav a.logout:hover {
            background: var(--danger-soft);
            color: #ff6b85;
            border-color: rgba(255,77,109,0.35);
        }

        /* ── Page content placeholder ── */
        .admin-content {
            position: relative;
            z-index: 1;
            padding: 2rem 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .admin-welcome {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .admin-welcome .welcome-icon {
            width: 52px; height: 52px;
            background: var(--accent-soft);
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem;
            color: var(--accent);
            flex-shrink: 0;
        }

        .admin-welcome h2 {
            font-family: 'Syne', sans-serif;
            font-size: 1.3rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 0.2rem;
        }

        .admin-welcome p { font-size: 0.875rem; color: var(--text2); }

        .admin-shortcut-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .shortcut-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            text-decoration: none;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .shortcut-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 36px rgba(0,0,0,0.3);
            border-color: rgba(124,92,252,0.25);
        }

        .shortcut-card .sc-icon {
            width: 42px; height: 42px;
            background: var(--accent-soft);
            border-radius: 11px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem;
            color: var(--accent);
            flex-shrink: 0;
        }

        .shortcut-card.danger .sc-icon {
            background: var(--danger-soft);
            color: var(--danger);
        }

        .shortcut-card h3 {
            font-family: 'Syne', sans-serif;
            font-size: 0.95rem;
            font-weight: 600;
            letter-spacing: -0.01em;
            margin-bottom: 0.15rem;
        }

        .shortcut-card p {
            font-size: 0.78rem;
            color: var(--muted);
        }

        /* ── Responsive ── */

        /* Tablet */
        @media (max-width: 768px) {
            .admin-content { padding: 1.25rem 1rem; }
            .admin-topbar  { padding: 0 1rem; }
        }

        /* Mobile: topbar stacks, nav becomes bottom bar */
        @media (max-width: 580px) {
            .admin-topbar {
                height: auto;
                padding: 0.85rem 1rem 0;
                flex-direction: column;
                align-items: stretch;
                gap: 0;
            }

            .admin-brand {
                padding-bottom: 0.85rem;
                border-bottom: 1px solid var(--border2);
            }

            .admin-nav {
                width: 100%;
                padding: 0.5rem 0 0.6rem;
                gap: 0.3rem;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
            }

            .admin-nav::-webkit-scrollbar { display: none; }

            .admin-nav a {
                flex: 1;
                justify-content: center;
                padding: 0.55rem 0.5rem;
                font-size: 0.8rem;
                background: var(--surface2);
                border-color: var(--border2);
                min-width: 70px;
            }

            .admin-nav a .nav-label { display: none; }
        }

        @media (max-width: 400px) {
            .admin-welcome { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
            .admin-shortcut-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="admin-topbar">
        <div class="admin-brand">
            <div class="brand-icon"><i class="fas fa-ghost"></i></div>
            <span class="brand-name">GhostMonitor</span>
            <span class="badge-admin">Admin</span>
        </div>
        <nav class="admin-nav">
            <a href="users.php">
                <i class="fas fa-users"></i>
                <span class="nav-label">Users</span>
            </a>
            <a href="manage.php">
                <i class="fas fa-cog"></i>
                <span class="nav-label">Manage</span>
            </a>
            <a href="../?logout=1" class="logout">
                <i class="fas fa-sign-out-alt"></i>
                <span class="nav-label">Logout</span>
            </a>
        </nav>
    </div>

    <div class="admin-content">
        <div class="admin-welcome">
            <div class="welcome-icon"><i class="fas fa-shield-alt"></i></div>
            <div>
                <h2>Admin Panel</h2>
                <p>Manage users, licenses, and system settings below.</p>
            </div>
        </div>

        <div class="admin-shortcut-grid">
            <a href="users.php" class="shortcut-card">
                <div class="sc-icon"><i class="fas fa-users"></i></div>
                <div>
                    <h3>Users</h3>
                    <p>View & manage parent accounts</p>
                </div>
            </a>
            <a href="manage.php" class="shortcut-card">
                <div class="sc-icon"><i class="fas fa-sliders-h"></i></div>
                <div>
                    <h3>Manage</h3>
                    <p>Licenses, settings & access</p>
                </div>
            </a>
            <a href="../?logout=1" class="shortcut-card danger">
                <div class="sc-icon"><i class="fas fa-sign-out-alt"></i></div>
                <div>
                    <h3>Logout</h3>
                    <p>End admin session</p>
                </div>
            </a>
        </div>
    </div>
</body>
</html>
