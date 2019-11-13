const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray } = require('./folders.fixtures')
const { makeNotesArray } = require('./notes.fixtures')

describe('Notes Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))

    describe(`GET /api/notes`, () => {
        context('Given no notes', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200, [])
            })
        })
        context('Given there are articles in the database', () => {
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db.into('folders').insert(testFolders)
                    .then(() => {
                        return db.into('notes').insert(testNotes)
                    })
            })

            it('GET /articles responds with 200 and all of the notes', () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200, testNotes)

            })
        })
    })

    describe.only(`GET /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            })
        })
        context('Given there are notes in the database', () => {
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db.into('folders').insert(testFolders)
                    .then(() => {
                        return db.into('notes').insert(testNotes)
                    })
            })

            it('GET /api/notes/:note_id responds with 200 and the specified note', () => {
                const noteId = 2
                const expectedNote = testNotes[noteId - 1]
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(200, expectedNote)
            })
        })
    })

    describe(`POST /api/notes`, () => {
        it(`creates a note, responding with 201 and the new note`, () => {
            this.retries(3)
            const newNote = {
                name: 'Test new note',
                folderId: 1,
                content: 'Test new note content'
            }

            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newArticle.name)
                    expect(res.body.folderId).to.eql(newArticle.folderId)
                    expect(res.body.content).to.eql(newArticle.content)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/notes/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        })
        const requiredFields = ['name', 'folderId', 'content']

        requiredFields.forEach(field => {
            const newNote = {
                name: 'Test new note',
                folderId: 1,
                content: 'Test new note content'
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newNote[field]

                return supertest(app)
                    .post('/api/notes')
                    .send(newNote)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe(`DELETE /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456
                return supertest(app)
                    .delete(`/api/notes/${noteId}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            })
        })
        context(`Given there are articles in the database`, () => {
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db.into('folders').insert(testFolders)
                    .then(() => {
                        return db.into('notes').insert(testNotes)
                    })
            })


            it(`responds with 204 and removes the note`, () => {
                const idToRemove = 2
                const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/notes/${idToRemove}`)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/notes`)
                            .expect(expectedNotes)
                    })
            })
        })
    })

    describe(`PATCH /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456
                return supertest(app)
                    .patch(`/api/notes/${noteId}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            })
        })

        context(`Given there are notes in the database`, () => {
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db.into('folders').insert(testFolders)
                    .then(() => {
                        return db.into('notes').insert(testNotes)
                    })
            })

            it(`responds with 204 and updates the note`, () => {
                const idToUpdate = 2
                const updateNote = {
                    name: 'updated name',
                    folderId: 1,
                    content: 'updated content',
                }
                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                }

                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send(updateNote)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .expect(expectedNote)
                    })
            })

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: { message: `Request body must contain either 'name', 'folderId' or 'content'` }
                    })
            })

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateNote = {
                    name: 'updated note title',
                }
                const expectedArticle = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                }
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({
                        ...updateNote,
                        fieldToIgnore: 'should not be in the GET response'
                    })
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .expect(expectedNote)
                    })
            })
        })
    })

    describe(`GET /api/folders`, () => {
        context(`Given no folders`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, [])
            })
        })
        context(`Given there are folders in the database`, () => {
            const testFolders = makeFoldersArray()

            beforeEach(`insert folders`, () => {
                return db.into('folders').insert(testFolders)
            })

            it(`GET /folders responds with 200 and all of the folders`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })
        })
    })
})
