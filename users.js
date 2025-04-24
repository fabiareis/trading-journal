// Sistema de gerenciamento de usuários
class UserManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    // Register a new user
    registerUser(fullName, username, password) {
        // Validate inputs
        if (!fullName || !username || !password) {
            return {
                success: false,
                message: 'Por favor, preencha todos os campos'
            };
        }

        // Check if username already exists
        if (this.users.some(user => user.username === username)) {
            return {
                success: false,
                message: 'Este nome de usuário já está em uso'
            };
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            fullName,
            username,
            password,
            createdAt: new Date().toISOString()
        };

        // Add user to array and save to localStorage
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));

        return {
            success: true,
            message: 'Usuário registrado com sucesso!'
        };
    }

    // Login user
    loginUser(username, password) {
        // Find user
        const user = this.users.find(u => u.username === username && u.password === password);

        if (!user) {
            return {
                success: false,
                message: 'Nome de usuário ou senha inválidos'
            };
        }

        // Set current user and login status
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');

        return {
            success: true,
            message: 'Login realizado com sucesso!'
        };
    }

    // Logout user
    logoutUser() {
        // Clear user session
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');

        return {
            success: true,
            message: 'Logout realizado com sucesso!'
        };
    }

    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // Get all users
    getUsers() {
        return this.users;
    }

    // Delete user
    deleteUser(userId) {
        const userIndex = this.users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return {
                success: false,
                message: 'Usuário não encontrado'
            };
        }

        // Remove user
        this.users.splice(userIndex, 1);
        localStorage.setItem('users', JSON.stringify(this.users));

        // Logout if it's the current user
        if (this.currentUser && this.currentUser.id === userId) {
            this.logoutUser();
        }

        return {
            success: true,
            message: 'Usuário removido com sucesso!'
        };
    }

    // Update user
    updateUser(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return {
                success: false,
                message: 'Usuário não encontrado'
            };
        }

        // Update user data
        this.users[userIndex] = {
            ...this.users[userIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Save changes
        localStorage.setItem('users', JSON.stringify(this.users));

        // Update current user if it's the same user
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = this.users[userIndex];
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }

        return {
            success: true,
            message: 'Usuário atualizado com sucesso!'
        };
    }
}

// Exportar para uso global
window.UserManager = UserManager;

// Criar instância global
window.userManagerInstance = new UserManager(); 