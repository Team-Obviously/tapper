export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    isLoggedIn: boolean
    loginTime: string
}

export const getCurrentUser = (): User | null => {
    try {
        const userData = localStorage.getItem('user')
        if (!userData) return null

        const user = JSON.parse(userData)
        return user.isLoggedIn ? user : null
    } catch (error) {
        console.error('Error getting current user:', error)
        return null
    }
}

export const setUser = (user: User): void => {
    localStorage.setItem('user', JSON.stringify(user))
}

export const logout = (): void => {
    localStorage.removeItem('user')
    localStorage.removeItem('jwt')
}

export const isLoggedIn = (): boolean => {
    const user = getCurrentUser()
    return user?.isLoggedIn || false
}

export const getUserId = (): string | null => {
    const user = getCurrentUser()
    return user?.id || null
}
