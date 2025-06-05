import { auth } from '../auth.js';
import { CONFIG } from '../config.js';

class ReportesManager {
    constructor() {
        this.reportes = {
            productos: [],
            categorias: [],
            temporal: []
        };
        this.filtros = {
            fechaInicio: null,
            fechaFin: null,
            categoria: null,
            producto: null
        };
        this.initializeElements();
        this.setupEventListeners();
        this.checkAdminAccess();
        this.loadCategorias();
        this.loadProductos();
        this.loadReportes();
    }

    initializeElements() {
        // Filtros
        this.fechaInicio = document.getElementById('fechaInicio');
        this.fechaFin = document.getElementById('fechaFin');
        this.categoria = document.getElementById('categoria');
        this.producto = document.getElementById('producto');
        this.btnFiltrar = document.getElementById('btnFiltrar');
        this.btnExportar = document.getElementById('btnExportar');
        this.periodoSelect = document.getElementById('periodoSelect');

        // Tablas
        this.tablaProductos = document.getElementById('tablaProductos').querySelector('tbody');
        this.tablaCategorias = document.getElementById('tablaCategorias').querySelector('tbody');
        this.tablaTemporal = document.getElementById('tablaTemporal').querySelector('tbody');

        // Resumen
        this.totalVentas = document.getElementById('totalVentas');
        this.cantidadPedidos = document.getElementById('cantidadPedidos');
        this.ticketPromedio = document.getElementById('ticketPromedio');
        this.productosVendidos = document.getElementById('productosVendidos');
    }

    setupEventListeners() {
        // Eventos de filtros
        this.btnFiltrar.addEventListener('click', () => this.loadReportes());
        this.categoria.addEventListener('change', () => this.loadProductos());
        this.periodoSelect.addEventListener('change', () => this.loadReportes());

        // Evento de exportación
        this.btnExportar.addEventListener('click', () => this.exportarReporte());
    }

    async checkAdminAccess() {
        const isAdmin = await auth.checkAdminStatus();
        if (!isAdmin) {
            window.location.href = '/index.html';
        }
    }

    async loadCategorias() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/categorias`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al cargar categorías');
            
            const categorias = await response.json();
            this.categoria.innerHTML = `
                <option value="">Todas las categorías</option>
                ${categorias.map(cat => `
                    <option value="${cat.id}">${cat.nombre}</option>
                `).join('')}
            `;
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar categorías', 'danger');
        }
    }

    async loadProductos() {
        try {
            const categoriaId = this.categoria.value;
            const url = categoriaId 
                ? `${CONFIG.API_URL}/productos/categoria/${categoriaId}`
                : `${CONFIG.API_URL}/productos`;

            const response = await fetch(url, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al cargar productos');
            
            const productos = await response.json();
            this.producto.innerHTML = `
                <option value="">Todos los productos</option>
                ${productos.map(prod => `
                    <option value="${prod.id}">${prod.nombre}</option>
                `).join('')}
            `;
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar productos', 'danger');
        }
    }

    async loadReportes() {
        try {
            const params = new URLSearchParams({
                fechaInicio: this.fechaInicio.value || '',
                fechaFin: this.fechaFin.value || '',
                categoria: this.categoria.value || '',
                producto: this.producto.value || '',
                periodo: this.periodoSelect.value
            });

            const response = await fetch(`${CONFIG.API_URL}/reportes/ventas?${params}`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al cargar reportes');
            
            const data = await response.json();
            this.reportes = data;
            this.updateUI();
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar reportes', 'danger');
        }
    }

    updateUI() {
        // Actualizar resumen
        this.totalVentas.textContent = this.formatCurrency(this.reportes.resumen.totalVentas);
        this.cantidadPedidos.textContent = this.reportes.resumen.cantidadPedidos;
        this.ticketPromedio.textContent = this.formatCurrency(this.reportes.resumen.ticketPromedio);
        this.productosVendidos.textContent = this.reportes.resumen.productosVendidos;

        // Actualizar tablas
        this.renderTablaProductos();
        this.renderTablaCategorias();
        this.renderTablaTemporal();
    }

    renderTablaProductos() {
        this.tablaProductos.innerHTML = this.reportes.productos.map(prod => `
            <tr>
                <td>${prod.nombre}</td>
                <td>${prod.categoria}</td>
                <td>${prod.cantidadVendida}</td>
                <td>${this.formatCurrency(prod.totalVendido)}</td>
                <td>${prod.porcentajeTotal.toFixed(2)}%</td>
            </tr>
        `).join('');
    }

    renderTablaCategorias() {
        this.tablaCategorias.innerHTML = this.reportes.categorias.map(cat => `
            <tr>
                <td>${cat.nombre}</td>
                <td>${cat.cantidadProductos}</td>
                <td>${this.formatCurrency(cat.totalVendido)}</td>
                <td>${cat.porcentajeTotal.toFixed(2)}%</td>
            </tr>
        `).join('');
    }

    renderTablaTemporal() {
        this.tablaTemporal.innerHTML = this.reportes.temporal.map(periodo => `
            <tr>
                <td>${periodo.nombre}</td>
                <td>${periodo.cantidadPedidos}</td>
                <td>${this.formatCurrency(periodo.totalVendido)}</td>
                <td>${periodo.porcentajeTotal.toFixed(2)}%</td>
            </tr>
        `).join('');
    }

    async exportarReporte() {
        try {
            const params = new URLSearchParams({
                fechaInicio: this.fechaInicio.value || '',
                fechaFin: this.fechaFin.value || '',
                categoria: this.categoria.value || '',
                producto: this.producto.value || '',
                periodo: this.periodoSelect.value
            });

            const response = await fetch(`${CONFIG.API_URL}/reportes/ventas/export?${params}`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al exportar reporte');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al exportar reporte', 'danger');
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Inicializar el manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.reportesManager = new ReportesManager();
}); 