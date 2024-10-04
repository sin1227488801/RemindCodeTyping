function togglePassword() {
    const passwordField = document.getElementById('password');
    const passwordToggle = document.getElementById('show-password');
    if (passwordToggle.checked) {
        passwordField.type = 'text';
    } else {
        passwordField.type = 'password';
    }
}