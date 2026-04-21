<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(0);
ini_set('display_errors', 0);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "leohub_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Connection failed"]);
    exit();
}

$year = isset($_GET['year']) ? intval($_GET['year']) : 2026;

$sql = "SELECT 
            MONTH(date) as month,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
        FROM expense_transactions_new
        WHERE YEAR(date) = $year
        GROUP BY MONTH(date)
        ORDER BY month";

$result = $conn->query($sql);
$monthlyData = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $monthlyData[] = $row;
    }
}

echo json_encode(["success" => true, "data" => $monthlyData]);
$conn->close();
?>