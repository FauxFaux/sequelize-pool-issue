const pMap = require('p-map');
const { Sequelize } = require('sequelize');

function log() {
  console.log(new Date().toISOString(), ...arguments);
}

async function testTimeout(sequelize) {
  try {

    const ids = [1, 2, 3, 4, 5, 6, 7, 8];

    await pMap(ids, async (id) => {
      log('starting', id);
      try {
        await sequelize.query('select pg_sleep(15)');
      } catch (e) {
        log('error', id, e);
        throw e;
      }
      log('done', id);
    });
  } finally {
    await sequelize.close();
  }
}

async function main() {
  const sequelize = new Sequelize('postgres://postgres@localhost:5432/test_koala', { pool: {
      max: 3,
      acquire: 100,
    }});

  let queries = 0;
  let blocks = 0;

  await Promise.all([
    (async () => {
      while (true) {
        try {
          await sequelize.query("select 1");
          queries += 1;
          log('queries', queries);
        } catch (e) {
          log('error', queries, e);
        }
      }
    })(),
    (async () => {
      while (true) {
        blockFor(40);
        await new Promise(resolve => setImmediate(resolve))
        blocks += 1;
        log('blocks', blocks);
      }
    })(),
  ]);

  // await testTimeout(sequelize);
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.error(e));

function blockFor(ms) {
  const start = Date.now();
  while (Date.now() - start < ms);
}
