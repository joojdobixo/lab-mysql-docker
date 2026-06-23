const express = require('express');
const controller = require('../controllers/usuariosController');
const { exigirAdmin } = require('../middlewares/auth');

const router = express.Router();

router.post('/', controller.criar);

router.get('/', exigirAdmin, controller.listar);
router.get('/:id', exigirAdmin, controller.buscarPorId);
router.put('/:id', exigirAdmin, controller.atualizar);
router.delete('/:id', exigirAdmin, controller.remover);

module.exports = router;