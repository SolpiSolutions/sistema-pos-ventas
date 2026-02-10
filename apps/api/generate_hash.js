// generate-hash.js
import bcrypt from 'bcrypt';

// Obtén la contraseña desde los argumentos de la línea de comandos
const password = process.argv[2];

if (!password) {
    console.error('Por favor, proporciona una contraseña.');
    console.log('Uso: node generate-hash.js <tu_contraseña_aqui>');
    process.exit(1);
}

const saltRounds = 12;
bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error al generar el hash:', err);
        return;
    }
    console.log('Contraseña en texto plano:', password);
    console.log('Hash generado (copia esto):', hash);
});