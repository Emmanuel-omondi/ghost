<?php 
require '../config.php'; 
if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
    header('Location: index.php'); exit;
}

$message = '';
if ($_POST) {
    if (isset($_POST['add_user'])) {
        $email = strtolower(trim($_POST['email']));
        $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
        $expiry = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        try {
            $stmt = $pdo->prepare("INSERT INTO licenses (parent_email, password_hash, expiry_date) VALUES (?, ?, ?)");
            $stmt->execute([$email, $password, $expiry]);
            $message = "User $email added successfully!";
        } catch (PDOException $e) {
            $message = "Error: " . $e->getMessage();
        }
    }
    
    if (isset($_POST['delete_user'])) {
        $stmt = $pdo->prepare("DELETE FROM licenses WHERE id = ?");
        $stmt->execute([$_POST['user_id']]);
        $message = "User deleted!";
    }
    
    if (isset($_POST['update_user'])) {
        $stmt = $pdo->prepare("UPDATE licenses SET expiry_date = ?, status = ? WHERE id = ?");
        $stmt->execute([$_POST['expiry_date'], $_POST['status'], $_POST['user_id']]);
        $message = "User updated!";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Users - Admin</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>
    <div class="admin-container">
        <header style="display: flex; justify-content: space-between; align-items: center; padding: 2rem;">
            <h1><i class="fas fa-cog"></i> Manage Users</h1>
            <div>
                <a href="users.php" class="btn-primary" style="margin-right: 1rem;">
                    <i class="fas fa-users"></i> View Users
                </a>
                <a href="index.php" class="btn-primary">
                    <i class="fas fa-arrow-left"></i> Admin Home
                </a>
            </div>
        </header>

        <?php if ($message): ?>
        <div style="padding: 1rem; margin: 1rem 0; border-radius: 10px; background: #10b981; color: white;">
            <?php echo $message; ?>
        </div>
        <?php endif; ?>

        <div class="admin-grid">
            <div class="panel">
                <h3><i class="fas fa-plus"></i> Add New User</h3>
                <form method="POST">
                    <div class="input-group">
                        <i class="fas fa-envelope"></i>
                        <input type="email" name="email" placeholder="Parent Email" required>
                    </div>
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" name="password" placeholder="Password" required>
                    </div>
                    <div class="input-group">
                        <label>Expiry Date</label>
                        <input type="datetime-local" name="expiry_date" value="<?php echo date('Y-m-dTH:i', strtotime('+30 days')); ?>">
                    </div>
                    <button type="submit" name="add_user" class="btn-success">
                        <i class="fas fa-plus"></i> Add User
                    </button>
                </form>
            </div>

            <div class="panel">
                <h3><i class="fas fa-search"></i> Quick Actions</h3>
                <form method="POST">
                    <div class="input-group">
                        <input type="email" name="search_email" placeholder="Enter email to manage...">
                        <button type="submit" name="find_user" class="btn-primary">
                            <i class="fas fa-search"></i> Find
                        </button>
                    </div>
                </form>
                
                <div style="margin-top: 1rem;">
                    <a href="view_all_data.php" class="btn-primary" target="_blank">
                        <i class="fas fa-eye"></i> View All Data
                    </a>
                </div>
            </div>
        </div>
    </div>

    <style>
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; }
    .panel { 
        background: rgba(255,255,255,0.95); 
        backdrop-filter: blur(20px); 
        padding: 2rem; 
        border-radius: 20px; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
    }
    .panel h3 { margin-bottom: 1.5rem; color: #1f2937; }
    .input-group { margin-bottom: 1rem; }
    .input-group input, .input-group select { 
        width: 100%; padding: 0.75rem; border: 2px solid rgba(0,0,0,0.1); 
        border-radius: 10px; font-size: 1rem; 
    }
    .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
    @media (max-width: 768px) { .admin-grid { grid-template-columns: 1fr; } }
    </style>
</body>
</html>