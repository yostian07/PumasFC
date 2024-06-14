document.addEventListener('DOMContentLoaded', () => {
    const registerPaymentForm = document.getElementById('registerPaymentForm');

    registerPaymentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const cedula = document.getElementById('paymentCedula').value;
        const fecha_pago = document.getElementById('paymentDate').value;
        const monto = document.getElementById('paymentAmount').value;
        const comentario = document.getElementById('paymentComment').value;

        try {
            const response = await fetch('http://localhost:3000/registrar-pagos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cedula, fecha_pago, monto, comentario })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            Swal.fire('Éxito', 'Pago registrado exitosamente', 'success');
            registerPaymentForm.reset();
        } catch (error) {
            Swal.fire('Error', 'Error al registrar el pago', 'error');
            console.error('Payment registration failed:', error);
        }
    });
});
