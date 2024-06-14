document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const playersTable = document.getElementById('playersTable');





    searchInput.addEventListener('input', () => loadPlayers(searchInput.value));





    loadPlayers();

    
    async function loadPlayers(query = '') {
        try {
            const response = await fetch(`/jugadores?q=${query}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const players = await response.json();
            renderPlayers(players);
        } catch (error) {
            console.error('Fetch players failed:', error);
        }
    }

    
    function renderPlayers(players) {
        playersTable.innerHTML = '';
        players.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-2 px-2 md:px-4 border-b">${player.nombre}</td>
                <td class="py-2 px-2 md:px-4 border-b">${player.cedula}</td>
                <td class="py-2 px-2 md:px-4 border-b">${player.categoria}</td>
                <td class="py-2 px-2 md:px-4 border-b">${player.encargado}</td>
                <td class="py-2 px-2 md:px-4 border-b">
                    <button class="edit-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded" data-id="${player.id}">Editar</button>
                    <button class="payment-btn bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded" data-id="${player.id}">Pago</button>
                </td>
            `;
            playersTable.appendChild(row);
        });
    
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => openEditModal(event.target.getAttribute('data-id')));
        });
    
        document.querySelectorAll('.payment-btn').forEach(button => {
            button.addEventListener('click', (event) => openPaymentModal(event.target.getAttribute('data-id')));
        });
    }
   
    function openEditModal(playerId) {
        fetch(`/jugadores/${playerId}`)
            .then(response => response.json())
            .then(player => {
                Swal.fire({
                    title: 'Editar Jugador',
                    html: `<input type="text" id="edit-nombre" class="swal2-input" value="${player.nombre}" placeholder="Nombre">
                           <input type="text" id="edit-cedula" class="swal2-input" value="${player.cedula}" placeholder="Cédula">
                           <input type="text" id="edit-categoria" class="swal2-input" value="${player.categoria}" placeholder="Categoría">
                           <input type="text" id="edit-encargado" class="swal2-input" value="${player.encargado}" placeholder="Encargado">`,
                    focusConfirm: false,
                    preConfirm: async () => {
                        const nombre = document.getElementById('edit-nombre').value;
                        const cedula = document.getElementById('edit-cedula').value;
                        const categoria = document.getElementById('edit-categoria').value;
                        const encargado = document.getElementById('edit-encargado').value;
                        try {
                            const response = await fetch(`/jugadores/${playerId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ nombre, cedula, categoria, encargado })
                            });
                            if (!response.ok) throw new Error('Network response was not ok');
                            const updatedPlayer = await response.json();
                            Swal.fire('Actualizado!', 'El jugador ha sido actualizado.', 'success');
                            loadPlayers();
                        } catch (error) {
                            console.error('Update player failed:', error);
                            Swal.fire('Error', 'Hubo un problema al actualizar el jugador.', 'error');
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Fetch player data failed:', error);
                Swal.fire('Error', 'Hubo un problema al cargar los datos del jugador.', 'error');
            });
    }
    
    function openPaymentModal(playerId) {
        // Lógica para abrir y manejar el modal de pago
        Swal.fire({
            title: 'Registrar Pago',
            html: `<input type="date" id="payment-fecha" class="swal2-input" placeholder="Fecha de Pago">
                   <input type="number" id="payment-monto" class="swal2-input" placeholder="Monto">
                   <input type="text" id="payment-comentario" class="swal2-input" placeholder="Comentario">`,
            focusConfirm: false,
            preConfirm: async () => {
                const fecha_pago = document.getElementById('payment-fecha').value;
                const monto = document.getElementById('payment-monto').value;
                const comentario = document.getElementById('payment-comentario').value;
                try {
                    const response = await fetch('/registrar-pagos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ jugador_id: playerId, fecha_pago, monto, comentario })
                    });
                    if (!response.ok) throw new Error('Network response was not ok');
                    const result = await response.json();
                    Swal.fire('Registrado!', 'El pago ha sido registrado.', 'success');
                } catch (error) {
                    console.error('Register payment failed:', error);
                    Swal.fire('Error', 'Hubo un problema al registrar el pago.', 'error');
                }
            }
        });
    }
});
