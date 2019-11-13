function makeNotesArray() {
    return [
        {
            id: 1,
            name: 'Note 1',
            modified: '2029-01-22T16:28:32.615Z',
            folderid: 3,
            content: 'Note 1 content'
        },
        {
            id: 2,
            name: 'Note 2',
            modified: '2029-01-25T16:28:32.615Z',
            folderid: 3,
            content: 'Note 2 content'
        },
        {
            id: 3,
            name: 'Note 3',
            modified: '2029-01-26T16:28:32.615Z',
            folderid: 1,
            content: 'Note 3 content'
        },
        {
            id: 4,
            name: 'Note 4',
            modified: '2029-01-27T16:28:32.615Z',
            folderid: 2,
            content: 'Note 4 content'
        },
        {
            id: 5,
            name: 'Note 5',
            modified: '2029-01-28T16:28:32.615Z',
            folderid: 1,
            content: 'Note 5 content'
        },
        {
            id: 6,
            name: 'Note 6',
            modified: '2029-01-30T16:28:32.615Z',
            folderid: 2,
            content: 'Note 6 content'
        }
    ]
}

module.exports = {
    makeNotesArray
}