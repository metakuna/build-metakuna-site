import {naturalMaleHazard, naturalFemaleHazard, naturalMeanHazard, maleLifeExp, femaleLifeExp, meanLifeExp} from './hazards.js'

let buttonDisabled = false

function simulateDeath(currentAge, gcrHazard, hazardTable) {
    let age = currentAge
    while (true) {
        if (Math.random() < gcrHazard + hazardTable[age] || age > 101) break
        age++
    }
    // const age = 50 + (Math.random() - 1) * 25
    const probGcr = gcrHazard / (hazardTable[age] + gcrHazard)
    return [age, probGcr]
}

function setButtonDisabled(isDisabled) {
    document.getElementById('calculate-button').disabled = isDisabled
    buttonDisabled = isDisabled
}

function runSim(sex, currentAge, gcrHazard, ages, probs, ages10Year, probs10Year) {
    if (!buttonDisabled) {
        setButtonDisabled(true)
    }

    let hazardTable, baseLifeExp
    switch (sex) {
        case "male":
            hazardTable = naturalMaleHazard
            baseLifeExp = maleLifeExp
            break
        case "female":
            hazardTable = naturalFemaleHazard
            baseLifeExp = femaleLifeExp
            break
        default:
            hazardTable = naturalMeanHazard
            baseLifeExp = meanLifeExp
    }

    // simulate 10_000 deaths
    for (let j = 0; j < 50_000; j++) {
        const [ageAtDeath, probGcr] = simulateDeath(currentAge, gcrHazard, hazardTable)
        ages.push(ageAtDeath)
        probs.push(probGcr)

        if (ageAtDeath <= currentAge + 10) {
            ages10Year.push(ageAtDeath)
            probs10Year.push(probGcr)
        }
    }

    const n = ages.length
    console.log("here" + n)
    const relative10YearRisk = probs10Year.reduce((a, b) => a + b, 0) / probs10Year.length
    const relativeLifetimeRisk = probs.reduce((a, b) => a + b, 0) / n
    const yearsLost = baseLifeExp[currentAge] - (ages.reduce((a, b) => a + b, 0) / n)

    updateResult(gcrHazard, hazardTable[currentAge], relative10YearRisk, relativeLifetimeRisk, yearsLost)

    if (n < 1e6) {
        window.setTimeout(runSim, 10, sex, currentAge, gcrHazard, ages, probs, ages10Year, probs10Year)
    } else {
        setButtonDisabled(false)
    }
}

function updateResult(gcrHazard, nonGcrHazard, relative10YearRisk, relativeLifetimeRisk, yearsLost) {
    document.getElementById('result').innerHTML = `
        <p>Your current annual risk of dying in a catastrophe is ${(gcrHazard * 100).toFixed(2)}%</p>
        <p>Your current annual risk of dying from other causes is ${(nonGcrHazard * 100).toFixed(2)}%</p>
        <p>If you die in the next 10 years, the chance of it being due to a catastrophe is ${(relative10YearRisk * 100).toFixed(2)}%</p>
        <p>Your lifetime risk of dying in a catastrophe is ${(relativeLifetimeRisk * 100).toFixed(2)}%</p>
        <p>You can expect to lose ${yearsLost.toFixed(2)} years of life due to catastrophic risks</p>
    `
}

export async function setParams() {
    const sex = document.getElementById('sex').value
    const age = document.getElementById('age').value
    const risk_10_per = document.getElementById('risk_10_per').value
    const risk_99_per = document.getElementById('risk_99_per').value

    const sex_invalid =  sex !== "male" && sex !== "female" && sex !== "other"
    const age_invalid = age === "" || Number(age) === NaN || Number(age) < 0 || Number(age) > 100
    const gcr_invalid = Number(risk_10_per) === NaN || Number(risk_99_per) === NaN || (risk_10_per === "" && risk_99_per === "")

    if (sex_invalid || age_invalid || gcr_invalid) return

    const currentSex = sex
    const currentAge = Math.floor(Number(age))
    const currentGcrHazard = 0.1 * (Number(risk_10_per) / 100) + 0.99 * (Number(risk_99_per) / 100)

    runSim(currentSex, currentAge, currentGcrHazard, [], [], [], [])
}

window.setParams = setParams