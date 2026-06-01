try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/verify-student" -Method POST -Body '{"univ_email":"test@example.com"}' -ContentType "application/json"
    $response | ConvertTo-Json | Out-File "verify_output.txt"
} catch {
    $msg = "HTTP Status: " + $_.Exception.Response.StatusCode.value__ + "`r`n"
    $msg += "Message: " + $_.ErrorDetails.Message + "`r`n"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $msg += "Body: " + $reader.ReadToEnd()
    $msg | Out-File "verify_output.txt"
}
