import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const MONGODB_URI = 'mongodb://wilfredoederp_db_user:Manchas2006@ac-ymftzow-shard-00-00.jb808jg.mongodb.net:27017,ac-ymftzow-shard-00-01.jb808jg.mongodb.net:27017,ac-ymftzow-shard-00-02.jb808jg.mongodb.net:27017/attendance?ssl=true&replicaSet=atlas-py9tij-shard-0&authSource=admin&appName=Cluster0'

const resetear = async () => {
  console.log('Conectando...')
  await mongoose.connect(MONGODB_URI)
  console.log('Conectado')
  
  const hash = await bcrypt.hash('admin123', 10)
  
  const result = await mongoose.connection.collection('users').updateOne(
    { email: 'wilfredoederp@gmail.com' },
    { $set: { passwordHash: hash } }
  )
  
  console.log('Resultado:', result.modifiedCount, 'documentos modificados')
  await mongoose.connection.close()
}

resetear().catch(console.error)