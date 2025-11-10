const { MongoClient } = require('mongodb');

async function checkSignatures() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('test');
        const collection = db.collection('candidates');
        
        // Find the specific candidate
        const candidate = await collection.findOne({ candidateId: '68f909508b0f083d6bf39efd' });
        
        if (candidate) {
            console.log('✅ Found candidate:', candidate.candidateName);
            console.log('📄 Candidate structure keys:', Object.keys(candidate));
            
            if (candidate.normalized && candidate.normalized.questions) {
                console.log('\n📋 Questions found:', candidate.normalized.questions.length);
                
                candidate.normalized.questions.forEach((question, index) => {
                    console.log(`\n--- Question ${index + 1}: ${question.title || question.id} ---`);
                    console.log('🔧 Question keys:', Object.keys(question));
                    
                    // Check if signatures object exists
                    if (question.signatures) {
                        console.log('🏷️  Available signature languages:', Object.keys(question.signatures));
                        
                        // Show each signature
                        Object.entries(question.signatures).forEach(([lang, sig]) => {
                            console.log(`\n${lang.toUpperCase()} signature:`);
                            console.log(sig.substring(0, 200) + (sig.length > 200 ? '...' : ''));
                        });
                    } else {
                        console.log('❌ No signatures object found');
                        if (question.signature) {
                            console.log('📝 Single signature found:', question.signature.substring(0, 100) + '...');
                        }
                    }
                });
            } else {
                console.log('❌ No normalized questions found');
                
                // Check other possible question locations
                if (candidate.codingAssessment && candidate.codingAssessment.questions) {
                    console.log('📋 Found questions in codingAssessment:', candidate.codingAssessment.questions.length);
                    
                    candidate.codingAssessment.questions.forEach((question, index) => {
                        console.log(`\n--- CodingAssessment Question ${index + 1}: ${question.title || question.id} ---`);
                        console.log('🔧 Question keys:', Object.keys(question));
                        
                        // Check if signatures object exists
                        if (question.signatures) {
                            console.log('🏷️  Available signature languages:', Object.keys(question.signatures));
                            
                            // Show each signature
                            Object.entries(question.signatures).forEach(([lang, sig]) => {
                                console.log(`\n${lang.toUpperCase()} signature:`);
                                console.log(sig.substring(0, 200) + (sig.length > 200 ? '...' : ''));
                            });
                        } else {
                            console.log('❌ No signatures object found');
                            if (question.signature) {
                                console.log('📝 Single signature found:', question.signature.substring(0, 100) + '...');
                            }
                        }
                    });
                    
                } else if (candidate.questions) {
                    console.log('📋 Found questions directly:', candidate.questions.length);
                } else {
                    console.log('❌ No questions found anywhere');
                }
            }
        } else {
            console.log('❌ Candidate not found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkSignatures();