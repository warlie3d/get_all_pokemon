const mongoose = require('mongoose')
require('dotenv').config()
const Pokemon = require('./Models/Pokemon')

async function getPokemon(url) {
    const response = await fetch(url)
    const data = await response.json()
    
    return {
        name: data.name,
        pokemonId:data.id,
        height: data.height,
        weight: data.weight,
        imageSrc: data.sprites.front_default
    }
}

async function savePokemon(pokemon) {
    try {
        await Pokemon.insertMany(pokemon)
    } catch (error) {
        console.log('ERROR saving pokemon', error)
    }
}

async function main() {
    console.log('START')
    
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('DB connected')
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
    
    await Pokemon.deleteMany()

    const start = performance.now()

    let baseUrl = 'https://pokeapi.co/api/v2/pokemon'
    let pokemonToSearch = true
    const pokemonPromises = []
    while (pokemonToSearch) {
        const response = await fetch(baseUrl)
        const data = await response.json()
        
        data.results.forEach(result => {
            pokemonPromises.push(getPokemon(result.url))
        })
        if (!data.next) {
            pokemonToSearch = false
        } else {
            baseUrl = data.next
        }
    }

 const data = await Promise.all(pokemonPromises)

    const size = 50;
    const pokemonToSave = [];
    for (let i=0; i < data.length; i += size) {
        pokemonToSave.push(savePokemon(data.slice(i, i + size)));
    }
    await Promise.all(pokemonToSave)

    const end = performance.now()
    const timeToComplete = end - start
    console.log('complete', timeToComplete)
    process.exit(0)
}

main()