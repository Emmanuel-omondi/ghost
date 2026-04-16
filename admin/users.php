<?php 
require '../config.php'; 
if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
    header('Location: index.php'); exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Users - Admin</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>
    <div class="admin-container">
        <header>
            <h1><i class="fas fa-users"></i> User Management</h1>
            <a href="index.php" class="btn-primary"><i class="fas fa-arrow-left"></i> Back</a>
        </header>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Days Left</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $stmt = $pdo->query("SELECT * FROM licenses ORDER BY expiry_date DESC");
                    while ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        $days = floor((strtotime($user['expiry_date']) - time()) / 86400);
                    ?>
                    <tr>
                        <td><?php echo htmlspecialchars($user['parent_email']); ?></td>
                        <td>
                            <span class="status <?php echo $user['status']; ?>">
                                <?php echo ucfirst($user['status']); ?>
                            </span>
                        </td>
                        <td><?php echo $days > 0 ? $days : 'Expired'; ?></td>
                        <td><?php echo $user['login_history'] ? end(json_decode($user['login_history'], true))['time'] : 'Never'; ?></td>
                        <td>
                            <button onclick="viewUser('<?php echo $user['parent_email']; ?>')" class="btn-primary">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editUser('<?php echo $user['id']; ?>')" class="btn-success">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteUser('<?php echo $user['id']; ?>')" class="btn-danger">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
    </div>

    <script>
    function viewUser(email) {
        window.open('../index.php?admin_view=' + email, '_blank');
    }
    function editUser(id) { /* Modal implementation */ }
    function deleteUser(id) { /* Confirmation + delete */ }
    </script>
</body>
</html>