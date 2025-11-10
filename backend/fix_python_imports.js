const { MongoClient } = require('mongodb');

async function fixPythonImports() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('test');
        const collection = db.collection('candidates');
        
        // Find the specific candidate
        const candidate = await collection.findOne({ candidateId: '68f909508b0f083d6bf39efd' });
        
        if (candidate && candidate.codingAssessment && candidate.codingAssessment.questions) {
            console.log('✅ Found candidate with questions:', candidate.codingAssessment.questions.length);
            
            // Update each question's Python signature
            for (const question of candidate.codingAssessment.questions) {
                if (question.signatures && question.signatures.python) {
                    const currentPython = question.signatures.python;
                    console.log(`\n📝 Updating Python signature for ${question.title}`);
                    console.log('Current:', currentPython.substring(0, 100) + '...');
                    
                    // Add the missing import at the beginning
                    if (!currentPython.includes('from typing import')) {
                        question.signatures.python = `from typing import List\n\n${currentPython}`;
                        console.log('✅ Added typing import');
                    }
                }
            }
            
            // Update the document in the database
            const result = await collection.updateOne(
                { candidateId: '68f909508b0f083d6bf39efd' },
                { 
                    $set: { 
                        codingAssessment: candidate.codingAssessment,
                        updatedAt: new Date()
                    } 
                }
            );
            
            console.log('\n🔄 Update result:', result);
            
        } else {
            console.log('❌ Candidate or questions not found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

fixPythonImports();