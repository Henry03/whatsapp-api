const prisma = require('./index');

class WhatsappSession {
    async sessionExists({ session }) {
        console.log("Checking session existence:", session);
        const existingSession = await prisma.session.findUnique({ where: { id: session } });
        console.log("Session exists?", existingSession !== null);
        return existingSession !== null;
    }
    

    async save(id, session) {
        console.log("Saving session:", id, session); // Debugging output
        await prisma.session.upsert({
            where: { id },
            update: { session: JSON.stringify(session) },
            create: { id, session: JSON.stringify(session) },
        });
        console.log("Session saved successfully!");
    }
    

    async remove(id) {
        await prisma.session.delete({ where: { id } }).catch(() => {});
    }

    async find(id) {
        const session = await prisma.session.findUnique({ where: { id } });
        return session ? JSON.parse(session.session) : null;
    }

    async list() {
        const sessions = await prisma.session.findMany();
        return sessions.map(s => ({ id: s.id, session: JSON.parse(s.session) }));
    }
}

module.exports = WhatsappSession;
