import { getUser } from '../../store/user.store.js';

export function load({ }) {
    const user = getUser();
    if (!user) {
        return {
            status: 404
        }
    }
    return {
        props: {
            user
        }
    }
}